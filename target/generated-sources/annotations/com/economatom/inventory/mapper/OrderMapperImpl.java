package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.response.OrderDetailResponseDTO;
import com.economatom.inventory.dto.response.OrderResponseDTO;
import com.economatom.inventory.model.Order;
import com.economatom.inventory.model.OrderDetail;
import com.economatom.inventory.model.User;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-01-30T21:47:22+0000",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.2 (GraalVM Community)"
)
@Component
public class OrderMapperImpl implements OrderMapper {

    @Autowired
    private OrderDetailMapper orderDetailMapper;

    @Override
    public OrderResponseDTO toResponseDTO(Order order) {
        if ( order == null ) {
            return null;
        }

        OrderResponseDTO orderResponseDTO = new OrderResponseDTO();

        orderResponseDTO.setUserId( orderUsersId( order ) );
        orderResponseDTO.setUserName( orderUsersName( order ) );
        orderResponseDTO.setTotalPrice( calculateTotalPrice( order ) );
        orderResponseDTO.setId( order.getId() );
        orderResponseDTO.setOrderDate( order.getOrderDate() );
        orderResponseDTO.setStatus( order.getStatus() );
        orderResponseDTO.setDetails( orderDetailListToOrderDetailResponseDTOList( order.getDetails() ) );

        return orderResponseDTO;
    }

    private Integer orderUsersId(Order order) {
        if ( order == null ) {
            return null;
        }
        User users = order.getUsers();
        if ( users == null ) {
            return null;
        }
        Integer id = users.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String orderUsersName(Order order) {
        if ( order == null ) {
            return null;
        }
        User users = order.getUsers();
        if ( users == null ) {
            return null;
        }
        String name = users.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    protected List<OrderDetailResponseDTO> orderDetailListToOrderDetailResponseDTOList(List<OrderDetail> list) {
        if ( list == null ) {
            return null;
        }

        List<OrderDetailResponseDTO> list1 = new ArrayList<OrderDetailResponseDTO>( list.size() );
        for ( OrderDetail orderDetail : list ) {
            list1.add( orderDetailMapper.toResponseDTO( orderDetail ) );
        }

        return list1;
    }
}
